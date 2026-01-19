import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.jsx',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            animation: {
                'blob': 'blob 7s infinite',
                'gradient': 'gradient 8s ease infinite',
                'slide-down': 'slideDown 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            animationDelay: {
                '2000': '2s',
                '4000': '4s',
            },
            scale: {
                '102': '1.02',
            },
            colors: {
                // CLICKAI Brand Colors
                'brand': {
                    primary: '#7C3AED',
                    'primary-light': '#9D5BFF',
                    'primary-dark': '#5B21B6',
                    secondary: '#3B82F6',
                    'secondary-light': '#60A5FA',
                    'secondary-dark': '#2563EB',
                    accent: '#22D3EE',
                    'accent-dark': '#06B6D4',
                },
                // Premium Dark Surfaces
                'surface': {
                    dark: '#0A0A0F',
                    DEFAULT: '#12121A',
                    elevated: '#1A1A24',
                    container: '#1E1E28',
                    'container-high': '#252530',
                },
                // Glass Effects
                'glass': {
                    bg: 'rgba(255, 255, 255, 0.1)',
                    border: 'rgba(255, 255, 255, 0.15)',
                },
            },
            keyframes: {
                blob: {
                    '0%': {
                        transform: 'translate(0px, 0px) scale(1)',
                    },
                    '33%': {
                        transform: 'translate(30px, -50px) scale(1.1)',
                    },
                    '66%': {
                        transform: 'translate(-20px, 20px) scale(0.9)',
                    },
                    '100%': {
                        transform: 'translate(0px, 0px) scale(1)',
                    },
                },
                gradient: {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center',
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center',
                    },
                },
                slideDown: {
                    '0%': {
                        transform: 'translateY(-100%)',
                        opacity: '0',
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1',
                    },
                },
                slideUp: {
                    '0%': {
                        transform: 'translateY(100%)',
                        opacity: '0',
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1',
                    },
                },
                fadeIn: {
                    '0%': {
                        opacity: '0',
                    },
                    '100%': {
                        opacity: '1',
                    },
                },
                scaleIn: {
                    '0%': {
                        transform: 'scale(0.9)',
                        opacity: '0',
                    },
                    '100%': {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                },
            },
        },
    },
    plugins: [],
};
