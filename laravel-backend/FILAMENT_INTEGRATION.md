# Filament Integration Guide

## Overview
Laravel backend được tích hợp Filament v3.3 - Admin panel framework hiện đại nhất cho Laravel.

## Installed Packages

### Core
- `filament/filament` (v3.3.45) - Core admin panel framework
- `filament/spatie-laravel-settings-plugin` (v3.3) - Settings management plugin

### Supporting Packages  
- `spatie/laravel-permission` (v6.10) - Role & Permission management (RBAC)
- `spatie/laravel-model-states` (v2.7) - User workflow states
- `spatie/laravel-settings` - Application settings

## Features

### ✅ User Management
- Complete CRUD operations
- Role-based access control (RBAC)
- User workflow states (Pending, Active, Suspended, Archived)
- Profile management

### ✅ Access Control
- **Roles**: Admin, Manager, User
- **Permissions**: View, Create, Edit, Delete users/roles/permissions
- Fine-grained permission system

### ✅ Dashboard Widgets
- User statistics (total, active, pending, suspended)
- Recent users list
- Account widget

### ✅ Database Notifications
- Bell icon notifications
- Real-time notification system
- Database-backed notifications table

## Admin Panel Routes

```
/admin              → Dashboard
/admin/login        → Login page
/admin/users        → User management
/admin/roles        → Role management  
/admin/permissions  → Permission management
```

## Default Credentials

```
Email: admin@example.com
Password: password
```

## Resources

### UserResource
- Location: `app/Filament/Resources/UserResource.php`
- Features:
  - Table with search, filters, bulk actions
  - Form with validation
  - Workflow state badges
  - Role assignment

### RoleResource
- Location: `app/Filament/Resources/RoleResource.php`
- Features:
  - Permission assignment
  - Guard name management
  - Relations with users

### PermissionResource
- Location: `app/Filament/Resources/PermissionResource.php`
- Features:
  - CRUD operations
  - Role relations
  - Guard name configuration

## Widgets

### UserStatsWidget
- Location: `app/Filament/Widgets/UserStatsWidget.php`
- Shows: Total users, Active, Pending, Suspended counts
- Updates in real-time

### RecentUsersWidget  
- Location: `app/Filament/Widgets/RecentUsersWidget.php`
- Shows: 10 most recent users
- Displays: Name, Email, Role, State

## Configuration

### Panel Provider
File: `app/Providers/Filament/AdminPanelProvider.php`

```php
->colors([
    'primary' => Color::Indigo,
    'danger' => Color::Rose,
    // ...
])
->font('Inter')
->databaseNotifications()
->sidebarCollapsibleOnDesktop()
->maxContentWidth('full')
```

### Navigation Groups
- **User Management** - Users, profile
- **Access Control** - Roles, Permissions

## Commands

```bash
# Publish assets
php artisan filament:assets

# Upgrade Filament
php artisan filament:upgrade

# Optimize
php artisan filament:optimize

# Create notifications table
php artisan notifications:table
php artisan migrate

# Clear all caches
php artisan optimize:clear

# Seed database with admin user
php artisan migrate:fresh --seed
```

## Customization

### Adding New Resources
```bash
php artisan make:filament-resource ModelName --generate
```

### Adding Widgets
```bash
php artisan make:filament-widget WidgetName
```

### Adding Pages
```bash
php artisan make:filament-page PageName
```

## Middleware Stack

- Session management
- CSRF protection
- Authentication
- Database notifications
- Livewire integration

## Database Tables

```
users               → User accounts
roles               → User roles
permissions         → System permissions
model_has_roles     → User-role assignments
model_has_permissions → Direct user permissions
role_has_permissions → Role-permission assignments
notifications       → Database notifications
```

## Plugin Integration

### Settings Plugin
```bash
# Create settings class
php artisan make:filament-settings-page SiteSettings
```

Features:
- Application-wide settings
- Group settings
- Type-safe configuration
- UI for managing settings

## Troubleshooting

### CSS not loading
```bash
php artisan filament:upgrade
php artisan optimize:clear
# Hard refresh browser (Cmd+Shift+R)
```

### Missing notifications table
```bash
php artisan notifications:table
php artisan migrate
```

### Permission errors
```bash
php artisan permission:cache-reset
php artisan optimize:clear
```

## Resources & Documentation

- [Filament Official Docs](https://filamentphp.com/docs)
- [Spatie Permission](https://spatie.be/docs/laravel-permission)
- [Spatie Settings](https://spatie.be/docs/laravel-settings)
- [Filament Plugins](https://filamentphp.com/plugins)
