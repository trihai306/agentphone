<x-filament-panels::page>
    <x-filament::section>
        <x-slot name="heading">
            Send Notification
        </x-slot>

        <x-slot name="description">
            Use this form to send real-time notifications to users or admins.
        </x-slot>

        <form wire:submit="sendNotification">
            {{ $this->form }}

            <div class="mt-6">
                <x-filament::button type="submit" size="lg">
                    <x-slot name="icon">
                        <x-heroicon-o-paper-airplane class="w-5 h-5" />
                    </x-slot>
                    Send Notification
                </x-filament::button>
            </div>
        </form>
    </x-filament::section>

    <x-filament::section class="mt-6">
        <x-slot name="heading">
            How Real-time Notifications Work
        </x-slot>

        <div class="prose dark:prose-invert max-w-none">
            <p>This system uses <strong>Soketi</strong> (a self-hosted Pusher alternative) for real-time WebSocket communication.</p>

            <h4>Notification Channels:</h4>
            <ul>
                <li><strong>User Channel</strong> (<code>user.{userId}</code>) - Private notifications for specific users</li>
                <li><strong>Admin Channel</strong> (<code>admins</code>) - Notifications for all admin users</li>
                <li><strong>Announcements</strong> (<code>announcements</code>) - Public system-wide announcements</li>
            </ul>

            <h4>Notification Types:</h4>
            <ul>
                <li><strong>WebSocket Notifications</strong> - Instant push to connected clients (React frontend)</li>
                <li><strong>Filament Notifications</strong> - Shows in the bell icon, persisted to database</li>
            </ul>

            <h4>Usage in Code:</h4>
            <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code>use App\Services\NotificationService;

$service = app(NotificationService::class);

// Send to specific user (WebSocket)
$service->notifyUser($userId, 'Title', 'Message', 'success');

// Send to all admins (WebSocket)
$service->notifyAdmins('Title', 'Message', 'warning');

// Send Filament notification (database + WebSocket)
$service->sendFilamentNotification($user, 'Title', 'Body', 'info');

// Send to all admins (Filament)
$service->filamentAdminSuccess('Title', 'Body');</code></pre>
        </div>
    </x-filament::section>
</x-filament-panels::page>
