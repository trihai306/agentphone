# Laravel Admin Panel Credentials

## Admin Login
- **URL**: http://laravel-backend.test/admin/login
- **Email**: admin@example.com
- **Password**: password

## Notes
- Admin user được tạo tự động khi chạy `php artisan migrate:fresh --seed`
- Admin có role "admin" với full permissions
- User state: Active

## Commands
```bash
# Clear cache
php artisan optimize:clear

# Publish Filament assets
php artisan filament:assets

# Upgrade Filament
php artisan filament:upgrade

# Recreate admin user
php artisan migrate:fresh --seed
```
