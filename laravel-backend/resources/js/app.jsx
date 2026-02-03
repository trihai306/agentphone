import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from './Contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { ToastProvider } from './Components/Layout/ToastProvider';
import { ConfirmProvider } from './Components/UI/ConfirmModal';
import PageTransition from './Components/Layout/PageTransition';
import ErrorBoundary from './Components/ErrorBoundary';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Sync i18n with Laravel locale from props (if available)
        const { locale } = props.initialPage.props;
        if (locale && ['vi', 'en'].includes(locale)) {
            i18n.changeLanguage(locale);
        }

        // Initialize Echo if user is authenticated
        const { auth } = props.initialPage.props;
        if (auth?.user && typeof window.initializeEcho === 'function') {
            const csrfToken = document.querySelector('meta[name="csrf-token"]');
            window.initializeEcho(csrfToken?.getAttribute('content'));
        }

        root.render(
            <I18nextProvider i18n={i18n}>
                <ThemeProvider>
                    <ErrorBoundary>
                        <ToastProvider>
                            <ConfirmProvider>
                                <PageTransition>
                                    <App {...props} />
                                </PageTransition>
                            </ConfirmProvider>
                        </ToastProvider>
                    </ErrorBoundary>
                </ThemeProvider>
            </I18nextProvider>
        );
    },
    progress: {
        color: '#8B5CF6',
        showSpinner: true,
    },
});
