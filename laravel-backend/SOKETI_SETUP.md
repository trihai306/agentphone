# Soketi WebSocket Setup Guide

This project uses **Soketi** as a self-hosted WebSocket server, compatible with Pusher protocol.

## Quick Start

### 1. Start Soketi Server (Docker)

```bash
cd laravel-backend
docker-compose -f docker-compose.soketi.yml up -d
```

### 2. Configure Environment

Copy the Soketi configuration to your `.env` file:

```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=app-id
PUSHER_APP_KEY=app-key
PUSHER_APP_SECRET=app-secret
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http
PUSHER_APP_CLUSTER=mt1

VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

### 3. Install PHP Dependencies

```bash
composer require pusher/pusher-php-server
```

### 4. Install Frontend Dependencies

```bash
npm install
# or
yarn install
```

### 5. Start Queue Worker (for database notifications)

```bash
php artisan queue:work
```

## Usage

### Backend - Sending Notifications

#### Option 1: Using NotificationService (Recommended)

```php
use App\Services\NotificationService;

// Inject or create instance
$notificationService = app(NotificationService::class);

// Send to specific user
$notificationService->notifyUser(
    user: $user, // User model or user ID
    title: 'Order Confirmed',
    message: 'Your order #123 has been confirmed',
    type: 'success', // info, success, warning, error
    data: ['order_id' => 123]
);

// Send to all admins
$notificationService->notifyAdmins(
    title: 'New Order',
    message: 'A new order has been placed',
    type: 'info',
    data: ['order_id' => 123]
);

// Send system-wide announcement
$notificationService->announce(
    title: 'Maintenance Notice',
    message: 'System will be under maintenance at 2 AM',
    type: 'warning'
);
```

#### Option 2: Using Events Directly

```php
use App\Events\UserNotification;
use App\Events\AdminNotification;
use App\Events\SystemAnnouncement;

// Send to specific user
event(new UserNotification(
    userId: $user->id,
    title: 'Welcome!',
    message: 'Thanks for joining us',
    type: 'success'
));

// Send to all admins
event(new AdminNotification(
    title: 'Alert',
    message: 'Something needs attention',
    type: 'warning'
));

// Public announcement
event(new SystemAnnouncement(
    title: 'Notice',
    message: 'This is a public announcement'
));
```

#### Option 3: Using Laravel Notifications (Database + Broadcast)

```php
use App\Notifications\GeneralNotification;
use App\Notifications\AdminAlertNotification;

// Notify user (saves to database + broadcasts)
$user->notify(new GeneralNotification(
    title: 'Action Required',
    message: 'Please complete your profile',
    type: 'info',
    actionUrl: '/profile',
    actionText: 'Complete Profile'
));

// Notify admin (Filament compatible)
$admin->notify(new AdminAlertNotification(
    title: 'New User Registered',
    message: 'A new user has registered',
    type: 'success',
    actionUrl: '/admin/users/123',
    actionText: 'View User'
));
```

### Frontend - Receiving Notifications

#### Option 1: Using NotificationProvider (React Context)

```jsx
// In your App or Layout component
import { NotificationProvider, NotificationBell, useNotificationContext } from './Components/Notifications';

function App() {
    const user = usePage().props.auth.user;

    return (
        <NotificationProvider
            userId={user?.id}
            isAdmin={user?.is_admin}
        >
            <YourApp />
        </NotificationProvider>
    );
}

// In your header/navbar
function Header() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    } = useNotificationContext();

    return (
        <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onRemove={removeNotification}
            onClear={clearAll}
        />
    );
}
```

#### Option 2: Using useNotifications Hook

```jsx
import { useNotifications } from './hooks/useNotifications';

function MyComponent() {
    const {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    } = useNotifications({
        userId: currentUser.id,
        isAdmin: currentUser.is_admin,
        onNotification: (notification) => {
            console.log('New notification:', notification);
            // Play sound, show toast, etc.
        },
        onAdminNotification: (notification) => {
            console.log('Admin notification:', notification);
        },
        onAnnouncement: (notification) => {
            console.log('System announcement:', notification);
        }
    });

    // Use the state...
}
```

#### Option 3: Direct Echo Subscription

```javascript
// Subscribe to user channel
window.Echo.private(`user.${userId}`)
    .listen('.notification', (data) => {
        console.log('User notification:', data);
    });

// Subscribe to admin channel
window.Echo.private('admins')
    .listen('.admin.notification', (data) => {
        console.log('Admin notification:', data);
    });

// Subscribe to public announcements
window.Echo.channel('announcements')
    .listen('.announcement', (data) => {
        console.log('Announcement:', data);
    });
```

## Testing

### Using Artisan Command

```bash
# Send all test notifications
php artisan notification:test

# Send only to a specific user
php artisan notification:test --type=user --user-id=1

# Send admin notification
php artisan notification:test --type=admin

# Send announcement
php artisan notification:test --type=announcement

# Send database notification (Filament compatible)
php artisan notification:test --type=database --user-id=1

# Custom message
php artisan notification:test --message="Hello World!"
```

### Using Tinker

```bash
php artisan tinker
```

```php
// Send user notification
event(new \App\Events\UserNotification(1, 'Test', 'Hello from Tinker', 'success'));

// Send admin notification
event(new \App\Events\AdminNotification('Admin Alert', 'Test message', 'warning'));

// Send announcement
event(new \App\Events\SystemAnnouncement('Announcement', 'Test announcement'));
```

## Channels

| Channel | Type | Description | Authorization |
|---------|------|-------------|---------------|
| `user.{userId}` | Private | User-specific notifications | User ID match |
| `admins` | Private | Admin notifications | Has admin role |
| `announcements` | Public | System-wide announcements | None |

## Notification Types

| Type | Color | Use Case |
|------|-------|----------|
| `info` | Blue | General information |
| `success` | Green | Successful operations |
| `warning` | Yellow | Warnings, alerts |
| `error` | Red | Errors, failures |

## Production Deployment

### Soketi Configuration

For production, update your `docker-compose.soketi.yml` or run Soketi with:

```yaml
environment:
  SOKETI_DEBUG: "0"
  SOKETI_DEFAULT_APP_ID: "your-secure-app-id"
  SOKETI_DEFAULT_APP_KEY: "your-secure-app-key"
  SOKETI_DEFAULT_APP_SECRET: "your-secure-app-secret"
```

### SSL/TLS (HTTPS)

For HTTPS, set in your `.env`:

```env
PUSHER_SCHEME=https
PUSHER_PORT=443
```

And configure Soketi with SSL certificates or put it behind a reverse proxy (Nginx, Traefik).

## Troubleshooting

### WebSocket not connecting

1. Check if Soketi is running: `docker ps`
2. Check Soketi logs: `docker logs soketi`
3. Verify `.env` configuration matches docker-compose settings
4. Check browser console for connection errors

### Notifications not received

1. Ensure queue worker is running: `php artisan queue:work`
2. Check channel authorization in `routes/channels.php`
3. Verify user has correct roles for admin channels

### Events not broadcasting

1. Check `BROADCAST_CONNECTION=pusher` in `.env`
2. Ensure `BroadcastServiceProvider` is registered in `bootstrap/providers.php`
3. Clear config cache: `php artisan config:clear`
