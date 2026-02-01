import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            detectTls: false, // Disable Herd/Valet TLS auto-detection
        }),
        react({
            include: "**/*.{jsx,tsx}",
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 5174,  // Changed from 5173 to avoid conflict
        hmr: {
            host: 'localhost',
            port: 5174,
        },
    },
});
