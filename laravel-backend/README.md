# CLICKAI Laravel Backend

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel"/>
  <img src="https://img.shields.io/badge/PHP-8.4-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP"/>
  <img src="https://img.shields.io/badge/Octane-Swoole-4FC08D?style=for-the-badge" alt="Octane"/>
  <img src="https://img.shields.io/badge/Filament-3.3-F59E0B?style=for-the-badge" alt="Filament"/>
</p>

Backend API & Admin Panel cho CLICKAI Platform, xây dựng trên Laravel 12 với Laravel Octane (Swoole) để đạt hiệu năng cao.

---

## 📋 Yêu cầu hệ thống

- **PHP** 8.2+ (khuyến nghị 8.4)
- **Composer** 2.x
- **Node.js** 18+ & npm
- **MySQL** 8.0+
- **Redis** 6+
- **Swoole** 6.0+ (cho production)

---

## 🚀 Cài đặt Development

### 1. Clone & Install dependencies

```bash
cd laravel-backend

# PHP dependencies
composer install

# Node dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure .env with your database credentials
```

### 3. Database Setup

```bash
# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed
```

### 4. Start Development Server

```bash
# Option 1: Concurrent development (recommended)
composer dev

# Option 2: Manual
php artisan serve          # Terminal 1
npm run dev                # Terminal 2
php artisan queue:listen   # Terminal 3
```

### 5. Start Soketi (WebSocket)

```bash
# Using Docker
docker-compose -f docker-compose.soketi.yml up -d

# Or install globally
npm install -g @soketi/soketi
soketi start --config=soketi-dev.json
```

---

## 🗂️ Cấu trúc dự án

```
laravel-backend/
├── app/
│   ├── Console/          # Artisan commands & Scheduler
│   ├── Events/           # Broadcasting events (29 events)
│   ├── Filament/         # Admin Panel
│   │   ├── Pages/        # Custom admin pages (11)
│   │   ├── Resources/    # CRUD resources (30+)
│   │   └── Widgets/      # Dashboard widgets (31)
│   ├── Http/
│   │   ├── Controllers/  # Request handlers
│   │   ├── Middleware/   # Request middleware
│   │   └── Requests/     # Form requests
│   ├── Jobs/             # Queue jobs
│   ├── Models/           # Eloquent models (42)
│   ├── Notifications/    # User notifications
│   ├── Policies/         # Authorization policies (31)
│   ├── Providers/        # Service providers
│   ├── Services/         # Business logic (27 services)
│   ├── States/           # Model states (Spatie)
│   └── Traits/           # Shared traits
├── config/               # Configuration files
├── database/
│   ├── factories/        # Model factories
│   ├── migrations/       # Database migrations
│   └── seeders/          # Database seeders
├── resources/
│   ├── css/              # Stylesheets
│   ├── js/
│   │   ├── Components/   # React components
│   │   ├── Hooks/        # Custom React hooks
│   │   ├── Layouts/      # Page layouts
│   │   ├── Pages/        # Inertia pages (25 modules)
│   │   └── i18n/         # Translations (vi, en)
│   └── views/            # Blade templates
├── routes/
│   ├── api.php           # API routes
│   ├── channels.php      # Broadcasting channels
│   ├── console.php       # Console routes
│   └── web.php           # Web routes
├── tests/                # PHPUnit tests
├── deploy.sh             # Production deploy script
├── soketi-dev.json       # Soketi dev config
├── soketi.json           # Soketi prod config
└── octane-nginx.conf     # Nginx config for Octane
```

---

## 🎯 Modules chính

| Module | Mô tả | Path |
|--------|-------|------|
| **AI Studio** | AI image/video generation | `Pages/AiStudio/` |
| **Flows** | Visual workflow editor | `Pages/Flows/` |
| **Devices** | Device fleet management | `Pages/Devices/` |
| **Campaigns** | Campaign orchestration | `Pages/Campaigns/` |
| **Marketplace** | Recipe marketplace | `Pages/Marketplace/` |
| **Data Collections** | Data management | `Pages/DataCollections/` |
| **Jobs** | Job monitoring | `Pages/Jobs/` |
| **Wallet** | Financial management | `Pages/Wallet/`, `Pages/Topup/` |

---

## 🔧 Key Services

| Service | Chức năng |
|---------|-----------|
| `WorkflowService` | Workflow execution & management |
| `DeviceService` | Device registration & presence |
| `CampaignService` | Campaign deployment & iteration |
| `AiGenerationService` | AI image/video generation |
| `WalletService` | Wallet & transaction management |
| `TopupService` | Package & credit topup |
| `RecordingService` | Recording upload & processing |

---

## 📡 Broadcasting Events

Hệ thống sử dụng Soketi (Pusher-compatible) để real-time communication:

```php
// Device presence
DeviceOnline::class
DeviceOffline::class

// Job updates
JobStatusUpdated::class
JobProgressUpdated::class
JobCompleted::class

// Workflow events  
WorkflowExecutionStarted::class
WorkflowExecutionCompleted::class

// Notifications
NotificationCreated::class
```

---

## 🔐 Admin Panel

Truy cập tại `/admin` - Xây dựng với Filament v3.

### Credentials mặc định

```
Email: admin@example.com
Password: password
```

### Resources chính

- **Users** - Quản lý người dùng
- **Devices** - Quản lý thiết bị
- **Workflows** - Quản lý workflow
- **Jobs** - Theo dõi jobs
- **Transactions** - Quản lý giao dịch
- **Packages** - Quản lý gói cước
- **Settings** - Cấu hình hệ thống

---

## 🚀 Production Deployment

### Yêu cầu Production

- PHP 8.4 với Swoole extension
- Supervisor cho process management
- Nginx làm reverse proxy

### Deploy nhanh

```bash
# SSH to server
cd /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend

# Run deploy script
bash deploy.sh main
```

### Deploy thủ công

```bash
# 1. Pull code
git fetch --all
git reset --hard origin/main

# 2. Dependencies
composer install --no-dev --optimize-autoloader
npm install && npm run build

# 3. Migrations
php artisan migrate --force

# 4. Cache
php artisan optimize:clear
php artisan optimize
php artisan filament:cache-components

# 5. Restart Octane
supervisorctl restart octane queue soketi
```

> ⚠️ **QUAN TRỌNG**: Laravel Octane giữ application trong memory. **PHẢI RESTART** Octane workers sau mỗi lần thay đổi code!

---

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=UserTest

# With coverage
php artisan test --coverage
```

---

## 📋 Artisan Commands

```bash
# Queue
php artisan queue:work --tries=3
php artisan queue:listen

# Cache
php artisan optimize:clear    # Clear all caches
php artisan optimize          # Rebuild caches

# Filament
php artisan filament:cache-components
php artisan make:filament-resource ModelName

# Octane
php artisan octane:start --server=swoole --port=8000
php artisan octane:reload
```

---

## 🔗 API Endpoints

### Device API
```
POST   /api/device/register     - Đăng ký thiết bị
POST   /api/device/heartbeat    - Cập nhật presence
POST   /api/device/action       - Thực thi action
```

### Workflow API
```
GET    /api/workflows           - Danh sách workflows
POST   /api/workflows           - Tạo workflow
GET    /api/workflows/{id}      - Chi tiết workflow
POST   /api/workflows/{id}/run  - Chạy workflow
```

### Recording API
```
POST   /api/recordings/events   - Upload recording events
GET    /api/recordings/{id}     - Chi tiết recording
```

---

## 📚 Documentation

- [Laravel 12 Documentation](https://laravel.com/docs/12.x)
- [Filament v3 Documentation](https://filamentphp.com/docs)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Laravel Octane Documentation](https://laravel.com/docs/12.x/octane)

---

## 📄 License

Proprietary - All rights reserved.
