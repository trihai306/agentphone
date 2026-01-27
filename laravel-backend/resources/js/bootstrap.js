import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Include CSRF token in all requests
const csrfToken = document.querySelector('meta[name="csrf-token"]');
if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
}

// Make Pusher available globally for Laravel Echo
window.Pusher = Pusher;

// Enable Pusher logging for debugging (disable in production)
Pusher.logToConsole = import.meta.env.DEV;

// Configuration for self-hosted Soketi
const pusherScheme = import.meta.env.VITE_PUSHER_SCHEME || 'https';
const useTLS = pusherScheme === 'https';
const pusherHost = import.meta.env.VITE_PUSHER_HOST || 'laravel-backend.test';
const pusherPort = parseInt(import.meta.env.VITE_PUSHER_PORT || '6001');

// Global Echo instance (null until initialized)
window.Echo = null;

// Lazy initialization function - only call when user is authenticated
window.initializeEcho = function (csrfToken) {
    // Already initialized, return existing instance
    if (window.Echo) {
        return window.Echo;
    }

    // Initialize Laravel Echo with Soketi configuration
    // CRITICAL: Override ALL hosts to prevent fallback to Pusher infrastructure
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',

        // WebSocket hosts - primary connection
        wsHost: pusherHost,
        wsPort: pusherPort,
        wssPort: pusherPort,

        // HTTP hosts - MUST be set for self-hosted Soketi to prevent fallback to Pusher
        httpHost: pusherHost,
        httpPort: pusherPort,
        httpsPort: pusherPort,

        // Force TLS and transport settings
        forceTLS: useTLS,
        cluster: 'mt1', // Required but ignored when wsHost is set

        // Disable Pusher infrastructure features
        enableStats: false,
        enabledTransports: ['ws', 'wss'],
        disabledTransports: ['sockjs'],

        // Auth configuration
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': csrfToken || '',
            },
        },
    });

    // Connection status handlers
    window.Echo.connector.pusher.connection.bind('connected', () => {
        console.log('✅ WebSocket connected');
    });
    window.Echo.connector.pusher.connection.bind('error', (err) => {
        console.error('❌ Soketi error:', err);
    });
    window.Echo.connector.pusher.connection.bind('disconnected', () => {
        console.warn('⚠️ Soketi disconnected');
    });

    return window.Echo;
};

