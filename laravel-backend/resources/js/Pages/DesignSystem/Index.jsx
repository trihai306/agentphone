import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/Contexts/ThemeContext';
import { useState } from 'react';
import LandingLayout from '@/Layouts/LandingLayout';

// Unified Icon System - All icons from NavLink.jsx
const icons = {
    // Navigation
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    device: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",

    // Automation
    flow: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
    seed: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    tasks: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    database: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",

    // Resources
    ai: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    credits: "M13 10V3L4 14h7v7l9-11h-7z",
    shop: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    media: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",

    // Finance
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    plus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    withdraw: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    bank: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
    package: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",

    // Utility
    bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    bug: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",

    // Actions
    check: "M5 13l4 4L19 7",
    close: "M6 18L18 6M6 6l12 12",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    delete: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
    copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",

    // Arrows
    arrowLeft: "M10 19l-7-7m0 0l7-7m-7 7h18",
    arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3",
    chevronDown: "M19 9l-7 7-7-7",
    chevronUp: "M5 15l7-7 7 7",

    // Status
    checkCircle: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    xCircle: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    exclamation: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",

    // Social
    heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    share: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",

    // Misc
    globe: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
    moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
};

// Icon categories
const iconCategories = {
    'Navigation': ['home', 'device', 'user', 'settings', 'globe'],
    'Automation': ['flow', 'seed', 'tasks', 'play', 'database'],
    'Resources': ['ai', 'credits', 'shop', 'media'],
    'Finance': ['wallet', 'plus', 'withdraw', 'bank', 'package'],
    'Utility': ['bell', 'bug', 'calendar', 'clock', 'link'],
    'Actions': ['check', 'close', 'edit', 'delete', 'search', 'filter', 'refresh', 'download', 'upload', 'copy'],
    'Arrows': ['arrowLeft', 'arrowRight', 'chevronDown', 'chevronUp'],
    'Status': ['checkCircle', 'xCircle', 'info', 'exclamation'],
    'Social': ['heart', 'star', 'share'],
    'Theme': ['sun', 'moon', 'eye'],
};

// Icon Component
const Icon = ({ name, className = "w-6 h-6", strokeWidth = 1.5 }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={icons[name] || icons.home} />
    </svg>
);

export default function DesignSystem() {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [copiedIcon, setCopiedIcon] = useState(null);
    const [previewTheme, setPreviewTheme] = useState(theme);

    const copyIconPath = (iconName) => {
        const path = icons[iconName];
        navigator.clipboard.writeText(path);
        setCopiedIcon(iconName);
        setTimeout(() => setCopiedIcon(null), 2000);
    };

    const copyIconComponent = (iconName) => {
        const component = `<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="${icons[iconName]}" />
</svg>`;
        navigator.clipboard.writeText(component);
        setCopiedIcon(iconName);
        setTimeout(() => setCopiedIcon(null), 2000);
    };

    const filteredIcons = selectedCategory === 'all'
        ? Object.keys(icons)
        : iconCategories[selectedCategory] || [];

    return (
        <LandingLayout>
            <Head title="Design System - CLICKAI" />

            <div className={`min-h-screen transition-colors duration-300 ${previewTheme === 'dark'
                ? 'bg-[#0a0a0c] text-white'
                : 'bg-gradient-to-br from-gray-50 to-white text-gray-900'
                }`}>
                {/* Header */}
                <div className={`sticky top-0 z-50 backdrop-blur-xl border-b ${previewTheme === 'dark'
                    ? 'bg-[#0a0a0c]/80 border-white/10'
                    : 'bg-white/80 border-gray-200'
                    }`}>
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                    <span className="text-lg font-bold text-white">C</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                                        Design System
                                    </h1>
                                    <p className={`text-sm ${previewTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Unified Icon Library & Theme System
                                    </p>
                                </div>
                            </div>

                            {/* Theme Toggle */}
                            <div className={`flex items-center gap-2 p-1 rounded-xl ${previewTheme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                                }`}>
                                <button
                                    onClick={() => setPreviewTheme('light')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${previewTheme === 'light'
                                        ? 'bg-white text-gray-900 shadow-lg'
                                        : previewTheme === 'dark'
                                            ? 'text-gray-400 hover:text-white'
                                            : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon name="sun" className="w-5 h-5" />
                                    <span className="text-sm font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => setPreviewTheme('dark')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${previewTheme === 'dark'
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon name="moon" className="w-5 h-5" />
                                    <span className="text-sm font-medium">Dark</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 mb-6">
                            <Icon name="ai" className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-medium text-violet-500">Design System v1.0</span>
                        </div>

                        <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${previewTheme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                                {Object.keys(icons).length}+
                            </span>
                            {' '}Unified Icons
                        </h2>

                        <p className={`text-lg max-w-2xl mx-auto ${previewTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Consistent, stroke-based SVG icons optimized for both light and dark themes.
                            Built with accessibility and performance in mind.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {[
                            { label: 'Total Icons', value: Object.keys(icons).length, icon: 'ai' },
                            { label: 'Categories', value: Object.keys(iconCategories).length, icon: 'database' },
                            { label: 'View Box', value: '24×24', icon: 'eye' },
                            { label: 'Stroke Width', value: '1.5', icon: 'edit' },
                        ].map((stat, i) => (
                            <div key={i} className={`p-6 rounded-2xl border ${previewTheme === 'dark'
                                ? 'bg-white/5 border-white/10'
                                : 'bg-white border-gray-200 shadow-sm'
                                }`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${previewTheme === 'dark'
                                    ? 'bg-violet-500/20 text-violet-400'
                                    : 'bg-violet-100 text-violet-600'
                                    }`}>
                                    <Icon name={stat.icon} className="w-5 h-5" />
                                </div>
                                <div className={`text-2xl font-bold ${previewTheme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>{stat.value}</div>
                                <div className={`text-sm ${previewTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                    }`}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === 'all'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                                : previewTheme === 'dark'
                                    ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                        >
                            All Icons
                        </button>
                        {Object.keys(iconCategories).map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === category
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                                    : previewTheme === 'dark'
                                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Icon Grid */}
                    <div className={`p-8 rounded-3xl border ${previewTheme === 'dark'
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white border-gray-200 shadow-sm'
                        }`}>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                            {filteredIcons.map(iconName => (
                                <button
                                    key={iconName}
                                    onClick={() => copyIconComponent(iconName)}
                                    className={`group relative flex flex-col items-center justify-center p-4 rounded-xl transition-all ${copiedIcon === iconName
                                        ? 'bg-green-500/20 ring-2 ring-green-500'
                                        : previewTheme === 'dark'
                                            ? 'hover:bg-white/10'
                                            : 'hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon
                                        name={iconName}
                                        className={`w-6 h-6 transition-transform group-hover:scale-110 ${copiedIcon === iconName
                                            ? 'text-green-500'
                                            : previewTheme === 'dark'
                                                ? 'text-gray-400 group-hover:text-white'
                                                : 'text-gray-600 group-hover:text-gray-900'
                                            }`}
                                    />
                                    <span className={`mt-2 text-xs truncate max-w-full ${copiedIcon === iconName
                                        ? 'text-green-500 font-medium'
                                        : previewTheme === 'dark'
                                            ? 'text-gray-500 group-hover:text-gray-300'
                                            : 'text-gray-400 group-hover:text-gray-600'
                                        }`}>
                                        {copiedIcon === iconName ? 'Copied!' : iconName}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Usage Guide */}
                    <div className="mt-16 grid md:grid-cols-2 gap-8">
                        {/* Light Mode Preview */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Icon name="sun" className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Light Mode</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 text-gray-700">
                                    <Icon name="home" className="w-5 h-5" />
                                    <span className="font-medium">Dashboard</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 text-violet-700">
                                    <Icon name="flow" className="w-5 h-5" />
                                    <span className="font-medium">Workflows</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg">
                                    <Icon name="ai" className="w-5 h-5" />
                                    <span className="font-medium">AI Studio</span>
                                </div>
                            </div>
                        </div>

                        {/* Dark Mode Preview */}
                        <div className="bg-[#0a0a0c] rounded-3xl p-8 border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                    <Icon name="moon" className="w-5 h-5 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Dark Mode</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                                    <Icon name="home" className="w-5 h-5" />
                                    <span className="font-medium">Dashboard</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 text-violet-400 hover:bg-white/10 hover:text-white transition-colors">
                                    <Icon name="flow" className="w-5 h-5" />
                                    <span className="font-medium">Workflows</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                                    <Icon name="ai" className="w-5 h-5" />
                                    <span className="font-medium">AI Studio</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code Example */}
                    <div className={`mt-12 p-8 rounded-3xl border ${previewTheme === 'dark'
                        ? 'bg-[#1a1a1e] border-white/10'
                        : 'bg-gray-900 border-gray-800'
                        }`}>
                        <h3 className="text-lg font-bold text-white mb-4">Usage Example</h3>
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                            {`// Import and use the Icon component
const Icon = ({ name, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icons[name]} />
    </svg>
);

// Usage in JSX
<Icon name="home" className="w-6 h-6 text-violet-500" />
<Icon name="ai" className="w-8 h-8" />
<Icon name="flow" className="w-5 h-5 text-white" />`}
                        </pre>
                    </div>

                    {/* Footer */}
                    <div className={`mt-16 text-center ${previewTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                        <p className="text-sm">
                            Built with Heroicons Outline style • Optimized for CLICKAI
                        </p>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
