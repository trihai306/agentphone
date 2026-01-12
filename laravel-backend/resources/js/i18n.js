import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly for reliability
import viTranslations from '../lang/vi.json';
import enTranslations from '../lang/en.json';

/**
 * Professional i18n configuration with:
 * - Static JSON imports (most reliable)
 * - Cookie-based language detection
 * - Fallback to Vietnamese
 */
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            vi: {
                translation: viTranslations
            },
            en: {
                translation: enTranslations
            }
        },

        // Language detection options
        detection: {
            // Order of language detection
            order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
            // Cookie name for storing language preference
            lookupCookie: 'locale',
            lookupLocalStorage: 'i18nextLng',
            // Cache user language on
            caches: ['cookie', 'localStorage'],
            // Cookie expiration (30 days)
            cookieMinutes: 60 * 24 * 30,
            // Cookie options
            cookieOptions: { path: '/', sameSite: 'lax' }
        },

        // Default and fallback language
        fallbackLng: 'vi',
        supportedLngs: ['vi', 'en'],

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: false, // Disable suspense to avoid SSR issues
        },

        // Debug mode (disable in production)
        debug: import.meta.env.DEV,
    });

/**
 * Change language programmatically
 * @param {string} langCode - 'vi' or 'en'
 */
export function changeLanguage(langCode) {
    if (['vi', 'en'].includes(langCode)) {
        i18n.changeLanguage(langCode);
        // Also update cookie for Laravel backend
        document.cookie = `locale=${langCode};path=/;max-age=${60 * 60 * 24 * 30};samesite=lax`;
    }
}

/**
 * Get current language
 */
export function getCurrentLanguage() {
    return i18n.language || 'vi';
}

export default i18n;
