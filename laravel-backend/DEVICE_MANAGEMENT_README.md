# Device Management System - Hướng Dẫn Sử Dụng

## Tổng Quan
Hệ thống quản lý thiết bị được xây dựng với **Laravel**, **InertiaJS**, **React**, và **TailwindCSS**. Giao diện hỗ trợ **Dark Mode** và **Light Mode** chuyên nghiệp.

## Cấu Trúc Dự Án

### Backend (Laravel)
```
app/
├── Http/
│   └── Controllers/
│       └── UserDeviceController.php    # Controller quản lý devices
├── Models/
│   └── Device.php                      # Model Device
└── Policies/
    └── DevicePolicy.php                # Policy authorization

database/
└── migrations/
    └── 2025_12_28_123935_create_devices_table.php
```

### Frontend (React + InertiaJS)
```
resources/
├── js/
│   ├── Layouts/
│   │   └── AppLayout.jsx              # Layout chính với sidebar, navbar
│   ├── Pages/
│   │   └── Devices/
│   │       ├── Index.jsx              # Danh sách devices (Grid & List view)
│   │       ├── Create.jsx             # Thêm device mới
│   │       └── Edit.jsx               # Chỉnh sửa device
│   ├── Contexts/
│   │   └── ThemeContext.jsx           # Context quản lý dark/light mode
│   └── app.jsx                        # Entry point
└── css/
    └── app.css                         # TailwindCSS
```

## Tính Năng

### 1. Quản Lý Devices
- ✅ **Danh sách devices** với 2 chế độ xem:
  - **Grid View**: Hiển thị dạng cards
  - **List View**: Hiển thị dạng table
- ✅ **Tìm kiếm** devices theo tên, model, device ID
- ✅ **Thêm mới** device
- ✅ **Chỉnh sửa** device
- ✅ **Xóa** device với xác nhận
- ✅ **Phân trang** danh sách devices

### 2. Giao Diện
- ✅ **Responsive Design**: Tối ưu cho mobile, tablet, desktop
- ✅ **Dark Mode / Light Mode**: Chuyển đổi mượt mà
- ✅ **Professional UI**: Thiết kế hiện đại với TailwindCSS
- ✅ **Flash Messages**: Thông báo success/error

### 3. Bảo Mật
- ✅ **Authorization**: User chỉ được quản lý devices của chính mình
- ✅ **Authentication**: Yêu cầu đăng nhập với Sanctum
- ✅ **Policy**: DevicePolicy kiểm soát quyền truy cập

## Cài Đặt & Chạy

### Bước 1: Chạy Migration
```bash
cd laravel-backend
php artisan migrate
```

### Bước 2: Cài Đặt Dependencies
```bash
# Nếu chưa cài
npm install
```

### Bước 3: Build Assets
```bash
# Development
npm run dev

# Production
npm run build
```

### Bước 4: Chạy Server
```bash
php artisan serve
```

### Bước 5: Truy Cập
- Đăng nhập vào hệ thống
- Truy cập: `http://localhost:8000/devices`

## API Routes

```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::resource('devices', UserDeviceController::class);
});
```

**Endpoints:**
- `GET /devices` - Danh sách devices
- `GET /devices/create` - Form thêm mới
- `POST /devices` - Lưu device mới
- `GET /devices/{id}/edit` - Form chỉnh sửa
- `PUT /devices/{id}` - Cập nhật device
- `DELETE /devices/{id}` - Xóa device

## Cấu Trúc Database

**Table: `devices`**
```
- id (bigint, primary key)
- user_id (bigint, foreign key -> users)
- device_id (string, unique) - ID thiết bị
- name (string, nullable) - Tên thiết bị
- model (string, nullable) - Model thiết bị
- android_version (string, nullable) - Phiên bản Android
- status (string, default: 'active') - Trạng thái: active, inactive, maintenance
- last_active_at (timestamp, nullable) - Lần hoạt động cuối
- created_at (timestamp)
- updated_at (timestamp)
```

## Tính Năng Dark Mode

Dark mode được quản lý bởi **ThemeContext** và lưu vào `localStorage`:

```javascript
// Sử dụng trong component
import { useTheme } from './Contexts/ThemeContext';

function MyComponent() {
    const { theme, toggleTheme } = useTheme();
    // theme: 'light' hoặc 'dark'
    // toggleTheme(): Chuyển đổi theme
}
```

## Tùy Chỉnh

### Thay Đổi Màu Chủ Đạo
Chỉnh sửa trong [tailwind.config.js](tailwind.config.js):
```javascript
theme: {
    extend: {
        colors: {
            primary: {...}, // Màu chính
        }
    }
}
```

### Thay Đổi Layout
Chỉnh sửa [AppLayout.jsx](resources/js/Layouts/AppLayout.jsx):
- Sidebar navigation
- Navbar actions
- Theme colors

### Thêm Field Mới
1. Thêm column trong migration
2. Thêm vào `$fillable` trong Model
3. Thêm field trong form Create.jsx và Edit.jsx
4. Cập nhật validation trong Controller

## Lưu Ý
- User chỉ được xem/sửa/xóa devices của chính mình
- Device ID là unique và không thể thay đổi
- Dark mode preference được lưu trong localStorage

## Screenshots

### Light Mode - Grid View
![Grid View Light](screenshots/grid-light.png)

### Dark Mode - List View
![List View Dark](screenshots/list-dark.png)

### Add Device Form
![Add Device](screenshots/add-device.png)

## Tech Stack
- **Backend**: Laravel 11
- **Frontend**: React 19
- **Routing**: InertiaJS 2.0
- **Styling**: TailwindCSS 3.4
- **Auth**: Laravel Sanctum
- **Build**: Vite 6

## Support
Nếu có vấn đề, vui lòng liên hệ qua GitHub Issues hoặc email.

---
**Developed with ❤️ using Laravel + InertiaJS + React + TailwindCSS**
