# Droidrun - Android Device Automation Platform

Nền tảng quản lý và automation cho Android devices với AI-powered workflows.

## 🏗️ Kiến trúc

### Desktop App (Python + Flet)
- **Location:** `droidrun-controller/`
- **Tech:** Python 3.14, Flet 0.28+, ADB
- **Purpose:** Desktop application để control Android devices

### Laravel API Backend
- **Location:** `laravel-backend/`
- **Tech:** Laravel 11, Sanctum, SQLite
- **Purpose:** Authentication và device session management

## 🚀 Quick Start

### Desktop App
```bash
cd droidrun-controller
source venv/bin/activate
python run_with_reload.py  # Development với hot reload
```

### Laravel Backend
```bash
cd laravel-backend
php artisan serve  # http://localhost:8000
```

## 📚 Documentation

- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Tổng quan dự án, kiến trúc, API endpoints
- **[API_INTEGRATION.md](API_INTEGRATION.md)** - Plan tích hợp Laravel API vào Desktop App
- **[droidrun-controller/AUTO_RELOAD.md](droidrun-controller/AUTO_RELOAD.md)** - Hot reload guide
- **[droidrun-controller/QUICK_START.md](droidrun-controller/QUICK_START.md)** - Quick start guide

## ✨ Features

### Desktop App
- ✅ Device discovery qua ADB
- ✅ Phone screen viewer
- ✅ AI-powered workflow automation
- ✅ Light/Dark theme
- ✅ Responsive design
- ✅ Hot reload development mode

### Laravel Backend
- ✅ User authentication (Sanctum)
- ✅ Device-based token management
- ✅ Multi-device session tracking
- ⏳ API integration với Desktop App (planned)

## 🔧 Tech Stack

**Frontend (Desktop):**
- Python 3.14
- Flet (Flutter-based UI)
- ADB (Android Debug Bridge)
- OpenAI/Gemini API

**Backend:**
- Laravel 11
- Laravel Sanctum
- SQLite
- PHP 8.2+

## 📖 API Endpoints

```
POST   /api/login                    # Login
GET    /api/user                     # Get user info
GET    /api/devices                  # List devices
DELETE /api/devices/{id}             # Remove device
POST   /api/devices/logout-all       # Logout all
```

Xem chi tiết: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md#-api-documentation)

## 🎯 Current Status

- ✅ Desktop App: Hoạt động độc lập với ADB
- ✅ Laravel Backend: API sẵn sàng
- ⏳ API Integration: Chưa tích hợp (xem [API_INTEGRATION.md](API_INTEGRATION.md))

## 👥 Development

### Hot Reload (Desktop App)
```bash
cd droidrun-controller
python run_with_reload.py
```

App sẽ tự động reload khi bạn chỉnh sửa code.

## 🔗 Related Links

- [Flet Documentation](https://flet.dev/)
- [Laravel Documentation](https://laravel.com/docs)
- [Android Debug Bridge (ADB)](https://developer.android.com/tools/adb)
