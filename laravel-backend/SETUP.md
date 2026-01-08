# Laravel Backend - DroidRun Controller API

Backend API cho ứng dụng DroidRun Controller sử dụng Laravel 11.

## Yêu cầu hệ thống

- PHP 8.2+
- Composer
- SQLite hoặc MySQL

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
cd laravel-backend
composer install
```

### 2. Cấu hình môi trường

```bash
# Copy file .env
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 3. Cấu hình database

File `.env` đã được cấu hình mặc định sử dụng SQLite:

```env
DB_CONNECTION=sqlite
```

Database file sẽ được tạo tự động tại `database/database.sqlite`

**Nếu muốn dùng MySQL**, sửa trong `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=droidrun
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Chạy migrations và seeders

```bash
# Tạo database file (nếu dùng SQLite)
touch database/database.sqlite

# Chạy migrations
php artisan migrate

# Seed dữ liệu mẫu (bao gồm packages)
php artisan db:seed --class=ServicePackageSeeder
```

### 5. Khởi chạy server

#### Với PHP Built-in Server:
```bash
php artisan serve
# Server chạy tại: http://localhost:8000
```

#### Với Laravel Valet (macOS):
```bash
# Di chuyển vào thư mục laravel-backend
cd laravel-backend

# Link valet
valet link droidrun-api

# Secure với HTTPS (optional)
valet secure droidrun-api

# API sẽ có tại: https://droidrun-api.test
```

#### Với Laravel Herd (macOS/Windows):
- Thêm thư mục `laravel-backend` vào Herd
- API sẽ tự động có tại: `https://laravel-backend.test`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/register` | Đăng ký tài khoản | No |
| POST | `/api/login` | Đăng nhập | No |
| POST | `/api/logout` | Đăng xuất | Yes |
| GET | `/api/user` | Lấy thông tin user | Yes |

### Packages (Gói dịch vụ)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/packages` | Lấy danh sách gói | No |
| GET | `/api/packages/{id}` | Chi tiết gói | No |

### Subscriptions (Đăng ký gói)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subscriptions/current` | Gói đang dùng | Yes |
| GET | `/api/subscriptions` | Lịch sử đăng ký | Yes |
| POST | `/api/subscriptions` | Đăng ký gói mới | Yes |
| DELETE | `/api/subscriptions/{id}` | Hủy đăng ký | Yes |
| PATCH | `/api/subscriptions/{id}/auto-renew` | Bật/tắt tự động gia hạn | Yes |

### Devices

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/devices` | Danh sách thiết bị | Yes |
| POST | `/api/devices` | Thêm thiết bị | Yes |
| DELETE | `/api/devices/{id}` | Xóa thiết bị | Yes |
| POST | `/api/devices/logout-all` | Đăng xuất tất cả | Yes |

## Cấu hình API URL cho App

### Option 1: Sử dụng PHP Built-in Server

Trong file `.env` của app (nếu có) hoặc set environment variable:

```bash
export LARAVEL_API_URL="http://localhost:8000"
```

Hoặc khi chạy app:

```python
# Trong droidrun-controller/app/services/auth_service.py
# Và droidrun-controller/app/services/package_service.py
# base_url mặc định sẽ đọc từ:
os.environ.get("LARAVEL_API_URL", "http://localhost:8000")
```

### Option 2: Sử dụng Valet/Herd (HTTPS)

```bash
export LARAVEL_API_URL="https://laravel-backend.test"
```

## Testing API

### Dùng curl:

```bash
# Lấy danh sách packages
curl http://localhost:8000/api/packages

# Register
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current subscription (cần token)
curl http://localhost:8000/api/subscriptions/current \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Dùng Postman/Insomnia:

Import collection từ file `api-collection.json` (nếu có)

## Database Schema

### service_packages
- Chứa thông tin các gói dịch vụ
- Fields: name, description, price, duration_days, features, etc.

### user_service_packages
- Quản lý đăng ký gói của user
- Fields: user_id, service_package_id, status, expires_at, etc.
- Statuses: pending, active, expired, cancelled, refunded

## Troubleshooting

### SQLite database locked
```bash
# Xóa và tạo lại database
rm database/database.sqlite
touch database/database.sqlite
php artisan migrate:fresh --seed
```

### CORS issues
Nếu gặp CORS error, cấu hình trong `config/cors.php` hoặc cài package:

```bash
composer require fruitcake/laravel-cors
```

### SSL Certificate errors (Valet/Herd)
```bash
# Với Valet
valet secure droidrun-api

# Trust certificate trong Keychain Access (macOS)
```

## Development

### Chạy tests
```bash
php artisan test
```

### Clear cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Xem routes
```bash
php artisan route:list
```

## Production Deployment

1. Set `APP_ENV=production` trong `.env`
2. Set `APP_DEBUG=false`
3. Optimize:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## License

MIT License
