# Quick Reference - Droidrun Project

## 📁 Cấu trúc

```
/Users/hainc/duan/agent/
├── droidrun-controller/    # Desktop App (Python + Flet)
└── laravel-backend/        # Laravel API Backend
```

## 🚀 Chạy Project

### 1. Desktop App (Terminal 1)
```bash
cd droidrun-controller
source venv/bin/activate
python run_with_reload.py
```

### 2. Laravel Backend (Terminal 2)
```bash
cd laravel-backend
php artisan serve
# → http://localhost:8000
```

## 📖 Documentation

| File | Mục đích |
|------|----------|
| [README.md](README.md) | Tổng quan project |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Chi tiết kiến trúc, API |
| [API_INTEGRATION.md](API_INTEGRATION.md) | Plan tích hợp API |

## 🔑 Laravel API

**Base URL:** `http://localhost:8000/api`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login` | POST | ❌ | Login & get token |
| `/user` | GET | ✅ | User info |
| `/devices` | GET | ✅ | List devices |
| `/devices/{id}` | DELETE | ✅ | Remove device |
| `/devices/logout-all` | POST | ✅ | Logout all |

## ✅ Status

- ✅ Desktop App: Fully functional
- ✅ Laravel API: Ready
- ✅ Hot Reload: Working
- ❌ Integration: Not connected yet
