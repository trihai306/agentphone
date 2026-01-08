{{-- Laravel Echo and Pusher for real-time notifications in Filament --}}
<script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
<script type="module">
    import Echo from 'https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/+esm';

    // Initialize Laravel Echo with Soketi configuration
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: '{{ config("broadcasting.connections.pusher.key") }}',
        wsHost: '{{ config("broadcasting.connections.pusher.options.host") }}',
        wsPort: {{ config("broadcasting.connections.pusher.options.port") }},
        wssPort: {{ config("broadcasting.connections.pusher.options.port") }},
        cluster: '{{ config("broadcasting.connections.pusher.options.cluster") }}',
        forceTLS: {{ config("broadcasting.connections.pusher.options.scheme") === 'https' ? 'true' : 'false' }},
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
    });

    // Subscribe to admin notifications channel
    @auth
    const userId = {{ auth()->id() }};

    // Private channel for this specific user
    window.Echo.private(`App.Models.User.${userId}`)
        .listen('.database-notification.created', (notification) => {
            console.log('Filament notification received:', notification);
            // Trigger Filament notification refresh
            if (window.Livewire) {
                window.Livewire.dispatch('database-notifications-received');
            }
        });

    // Admin channel for all admin notifications
    window.Echo.private('admins')
        .listen('.admin.notification', (data) => {
            console.log('Admin notification received:', data);
            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
                new Notification(data.title, {
                    body: data.message,
                    icon: '/favicon.ico'
                });
            }
            // Show toast notification using Filament's notification system
            if (window.Livewire) {
                window.Livewire.dispatch('notify', {
                    status: data.type || 'info',
                    title: data.title,
                    body: data.message
                });
            }
        });

    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }

    console.log('Laravel Echo initialized for Filament Admin Panel');
    @endauth
</script>
