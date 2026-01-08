# DroidRun Controller - Package Management Setup Guide

Hướng dẫn cấu hình và chạy tính năng quản lý gói dịch vụ.

## 🚀 Quick Start

### 1. Setup Laravel Backend

```bash
cd laravel-backend

# Chạy script setup tự động
./setup.sh

# Hoặc setup thủ công:
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan db:seed --class=ServicePackageSeeder

# Khởi chạy server
php artisan serve
```

Backend sẽ chạy tại: `http://localhost:8000`

### 2. Cấu hình App để kết nối Backend

#### Option A: Environment Variable (Khuyến nghị)

```bash
# Trên macOS/Linux
export LARAVEL_API_URL="http://localhost:8000"

# Trên Windows (PowerShell)
$env:LARAVEL_API_URL="http://localhost:8000"

# Chạy app
cd droidrun-controller
flet run app
```

#### Option B: Sửa trực tiếp trong code

Sửa file `droidrun-controller/app/services/auth_service.py` (dòng 130):

```python
if base_url is None:
    base_url = os.environ.get("LARAVEL_API_URL", "http://localhost:8000")  # Đổi URL này
```

Và file `droidrun-controller/app/services/package_service.py` (dòng 172):

```python
if base_url is None:
    base_url = os.environ.get("LARAVEL_API_URL", "http://localhost:8000")  # Đổi URL này
```

### 3. Chạy App

```bash
cd droidrun-controller
flet run app
```

## 📋 Kiểm tra Backend hoạt động

### Test API với curl:

```bash
# 1. Kiểm tra danh sách packages
curl http://localhost:8000/api/packages

# 2. Đăng ký user test
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# 3. Login để lấy token
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response sẽ có "token": "xxx..."

# 4. Kiểm tra subscription hiện tại (thay YOUR_TOKEN)
curl http://localhost:8000/api/subscriptions/current \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Subscribe vào package (thay YOUR_TOKEN và package_id)
curl -X POST http://localhost:8000/api/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package_id": 2}'
```

## 🎨 Features trong App

### Navigation
- Click vào **"Packages"** trong sidebar để xem trang quản lý gói

### Trang Packages bao gồm:

1. **Current Subscription Card** (nếu đã mua):
   - Tên gói đang dùng
   - Trạng thái (Active/Cancelled/Expired)
   - Số ngày còn lại
   - Auto-renew status
   - Nút "Manage Subscription"

2. **Package Cards Grid**:
   - Danh sách các gói có sẵn
   - Badge "POPULAR" cho gói phổ biến
   - Giá tiền định dạng VND
   - Danh sách features
   - Nút "Subscribe" hoặc "Current Plan"

3. **Responsive Design**:
   - Desktop: Grid 3 cột
   - Tablet: Grid 2 cột
   - Mobile: Stack dọc với bottom nav

## 🔧 Troubleshooting

### Lỗi: "Unable to connect to server"

**Nguyên nhân**: App không kết nối được backend

**Giải pháp**:
1. Kiểm tra backend đang chạy: `curl http://localhost:8000/api/packages`
2. Kiểm tra LARAVEL_API_URL đúng chưa
3. Nếu dùng HTTPS (Valet/Herd), đảm bảo SSL cert được trust

### Lỗi: "Server returned invalid response format"

**Nguyên nhân**: Backend trả về lỗi HTML thay vì JSON

**Giải pháp**:
1. Check Laravel logs: `tail -f laravel-backend/storage/logs/laravel.log`
2. Kiểm tra database đã migrate chưa: `php artisan migrate:status`
3. Chạy lại seeder: `php artisan db:seed --class=ServicePackageSeeder`

### Lỗi: "No active subscription found"

**Bình thường**: User chưa đăng ký gói nào

**Giải pháp**: Click nút "Subscribe" trên một package để đăng ký

### Lỗi SSL Certificate (Valet/Herd)

**Nguyên nhân**: Self-signed certificate không được trust

**Giải pháp**:
```python
# Code đã được cấu hình để bypass SSL verification trong dev
# Xem: app/services/package_service.py line 177-180

# Nếu cần secure hơn cho production:
self._ssl_context.check_hostname = True
self._ssl_context.verify_mode = ssl.CERT_REQUIRED
```

## 📦 Package Data Sample

Backend seed 5 packages mẫu:

1. **Starter** (Free Trial)
   - 0đ / 7 days
   - 2 devices, 100 credits

2. **Basic**
   - 100,000đ / month
   - 5 devices, 1,000 credits

3. **Professional** (POPULAR)
   - 300,000đ / month
   - 20 devices, 5,000 credits

4. **Annual Professional** (SAVE 20%)
   - 2,880,000đ / year
   - 20 devices, 60,000 credits

5. **Enterprise** (BEST VALUE)
   - 800,000đ / month
   - Unlimited devices, 20,000 credits

## 🔐 Security Notes

- Backend sử dụng Laravel Sanctum cho API authentication
- Token được lưu trong app session
- SSL verification bị tắt trong development (check code để bật lại cho production)
- Payment được auto-activate trong demo (cần tích hợp payment gateway thật cho production)

## 📚 API Documentation

Chi tiết đầy đủ tại: `laravel-backend/SETUP.md`

### Main Endpoints:

```
GET    /api/packages                      # Danh sách gói
GET    /api/packages/{id}                 # Chi tiết gói
GET    /api/subscriptions/current         # Gói đang dùng
GET    /api/subscriptions                 # Lịch sử
POST   /api/subscriptions                 # Đăng ký
DELETE /api/subscriptions/{id}            # Hủy
PATCH  /api/subscriptions/{id}/auto-renew # Cập nhật auto-renew
```

## 🎯 Next Steps

### Production Checklist:

- [ ] Tích hợp payment gateway (Stripe, VNPay, etc.)
- [ ] Bật SSL verification
- [ ] Setup email notifications cho subscription expiry
- [ ] Add subscription renewal cron job
- [ ] Implement refund logic
- [ ] Add promo codes/discounts
- [ ] Setup monitoring và logging
- [ ] Load testing

## 💡 Tips

- Dùng **Laravel Tinker** để debug: `php artisan tinker`
- Xem routes: `php artisan route:list`
- Clear cache: `php artisan cache:clear`
- Check queue jobs: `php artisan queue:work`

## 📞 Support

Nếu gặp vấn đề, check:
1. Laravel logs: `laravel-backend/storage/logs/laravel.log`
2. App console output khi chạy
3. Network tab trong browser DevTools (nếu dùng web build)
