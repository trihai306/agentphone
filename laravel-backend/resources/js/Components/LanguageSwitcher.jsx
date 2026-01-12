import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

const languages = [
    {
        code: 'vi',
        name: 'Tiếng Việt',
        flag: '🇻🇳',
        nativeName: 'Tiếng Việt'
    },
    {
        code: 'en',
        name: 'English',
        flag: '🇬🇧',
        nativeName: 'English'
    },
];

export default function LanguageSwitcher({ className = '' }) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isChanging, setIsChanging] = useState(false);

    // Get current language from i18n (more reliable)
    const currentLang = i18n.language || 'vi';
    const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

    const handleLanguageChange = (langCode) => {
        if (langCode === currentLang || isChanging) return;

        setIsChanging(true);
        setIsOpen(false);

        // Use the centralized changeLanguage function
        changeLanguage(langCode);

        // Small delay for UI feedback, then refresh to sync with Laravel session
        setTimeout(() => {
            setIsChanging(false);
            // Reload page to ensure Laravel session is synced
            window.location.reload();
        }, 200);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Language Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-lg group"
                aria-label="Select language"
                disabled={isChanging}
            >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                    {currentLanguage.flag}
                </span>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentLanguage.code.toUpperCase()}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Language Options */}
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 space-y-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${lang.code === currentLang
                                        ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-200 dark:border-blue-700'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'
                                        }`}
                                    disabled={isChanging}
                                >
                                    <span className="text-2xl">{lang.flag}</span>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {lang.nativeName}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {lang.name}
                                        </div>
                                    </div>
                                    {lang.code === currentLang && (
                                        <svg
                                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Footer Hint */}
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                {i18n.language === 'vi' ? 'Ngôn ngữ sẽ được lưu' : 'Language preference will be saved'}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
