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

// Determine if we should use TLS based on scheme
const pusherScheme = import.meta.env.VITE_PUSHER_SCHEME || 'https';
const useTLS = pusherScheme === 'https';

// Initialize Laravel Echo with Soketi configuration
window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',
    wsHost: import.meta.env.VITE_PUSHER_HOST || 'laravel-backend.test',
    wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    forceTLS: useTLS,
    encrypted: useTLS,
    disableStats: true,
    enabledTransports: useTLS ? ['wss'] : ['ws'],
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': csrfToken ? csrfToken.getAttribute('content') : '',
        },
    },
});

// Log connection status
window.Echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ Soketi WebSocket connected!');
});
window.Echo.connector.pusher.connection.bind('error', (err) => {
    console.error('❌ Soketi WebSocket error:', err);
});
window.Echo.connector.pusher.connection.bind('disconnected', () => {
    console.warn('⚠️ Soketi WebSocket disconnected');
});

